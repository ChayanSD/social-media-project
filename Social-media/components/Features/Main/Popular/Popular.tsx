import { Select, SelectItem, SelectContent, SelectGroup, SelectLabel, SelectTrigger, SelectValue } from '@/components/ui/select';
import React from 'react';
import Post from '../Post/Post';

const sortBy = [
    {
        label: 'Best',
        value: 'best',
    },
    {
        label: 'Hot',
        value: 'hot',
    },
    {
        label: 'New',
        value: 'new',
    },
    {
        label: 'Top',
        value: 'top',
    },
    {
        label: 'Rising',
        value: 'rising',
    },
]

const countries = [
    {
        label: 'United States',
        value: 'united-states',
    },
    {
        label: 'Canada',
        value: 'canada',
    },
    {
        label: 'United Kingdom',
        value: 'united-kingdom',
    },
    {
        label: 'Australia',
        value: 'australia',
    },
    {
        label: 'New Zealand',
        value: 'new-zealand',
    },
    {
        label: 'India',
        value: 'india',
    },
    {
        label: 'Pakistan',
        value: 'pakistan',
    },
    {
        label: 'Afghanistan',
        value: 'afghanistan',
    },
    {
        label: 'Bangladesh',
        value: 'bangladesh',
    },
    {
        label: 'Sri Lanka',
        value: 'sri-lanka',
    },
    {
        label: 'Malaysia',
        value: 'malaysia',
    },
    {
        label: 'Singapore',
        value: 'singapore',
    },
    {
        label: 'Hong Kong',
        value: 'hong-kong',
    }
]

const Popular = () => {
    return (
        <div>
            <div className='bg-slate-900 p-4 rounded-lg flex items-center gap-4 sticky top-11 z-10'>
                <Select>
                    <SelectTrigger className="text-white border border-slate-800">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className='bg-slate-700 text-white border-none ring-0'>
                        <SelectGroup className=''>
                            <SelectLabel>Sort by</SelectLabel>
                            {sortBy.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
                <Select>
                    <SelectTrigger className="text-white border border-slate-800">
                        <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent className='bg-slate-700 text-white border-none ring-0'>
                        <SelectGroup className=''>
                            <SelectLabel>Sort by</SelectLabel>
                            {countries.map((item) => (
                                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
                            ))}
                        </SelectGroup>
                    </SelectContent>
                </Select>
            </div>
            <div className='mt-6 space-y-4 px-1'>
                {/* <Post/>
                <Post/>
                <Post/>
                <Post/>
                <Post/> */}
            </div>
        </div>
    );
};

export default Popular;